import { FunctionId, OperationId } from '../data/identifiers';
import { canBeInput } from '../data/Values';
import type { ConnectionProps } from '../display/ConnectionDisplay';
import { gridSize } from '../display/Constants';
import type { IOProps } from '../display/ConnectorButton';
import type { OperationData } from '../display/OperationDisplay';
import { OperationConfigData } from '../layout/OperationConfigEditor';
import { getFunction } from '../models/CodeFunction';
import { FunctionOperation } from '../models/FunctionOperation';
import { Process } from '../models/Process';
import { Workspace } from '../models/Workspace';
import { getUniqueName } from './getUniqueName';
import { mapToObject, objectToObject } from './maps';
import { inputsFromProcess, outputsFromProcess, propsFromProcess } from './propsFromProcess';
import { tryConnect } from './tryConnect';

export interface ParameterData {
    value: string;
    canRemove: boolean;
}

export interface WorkspaceState {
    workspace: Workspace;
    lastFunctionalChange: number;
    inputValues: Record<string, ParameterData>;
    outputValues: Record<string, ParameterData>;
    operations: OperationData[];
    connections: ConnectionProps[];
    inputs: IOProps[];
    outputs: IOProps[];
    editOperation: OperationConfigData | null;
}

export const emptyState: WorkspaceState = {
    workspace: {} as unknown as Workspace, // This object should never be accessed. Right?
    lastFunctionalChange: Date.now(),
    inputValues: {},
    outputValues: {},
    operations: [],
    connections: [],
    inputs: [],
    outputs: [],
    editOperation: null,
}

export type WorkspaceAction = {
    type: 'load';
    workspace: Workspace;
} | {
    type: 'setInput';
    name: string;
    value: string;
} | {
    type: 'addInput';
} | {
    type: 'removeInput';
    name: string;
} | {
    type: 'addOutput';
} | {
    type: 'removeOutput';
    name: string;
} | {
    type: 'setOutputValues';
    values: Record<string, string>;
} | {
    type: 'setEditOperation';
    id: OperationId | null;
} | {
    type: 'setOperationConfigValue';
    operationId: OperationId;
    config: string;
    value: string | null;
} | {
    type: 'connect';
    fromOperation?: OperationId,
    fromConnector: number,
    toOperation?: OperationId,
    toConnector: number,
} | {
    type: 'disconnect';
    operation: OperationId;
    input: number;
} | {
    type: 'addOperation';
    functionId: FunctionId;
} | {
    type: 'moveOperation';
    id: OperationId;
    x: number;
    y: number;
}

function canRemoveInput(process: Process, input: string) {
    if (process.inputs.size <= 1) {
        return false;
    }
    
    if (process.isInputConnected(input)) {
        return false;
    }

    return true;
}

function canRemoveOutput(process: Process, output: string) {
    if (process.outputs.size <= 1) {
        return false;
    }
    
    if (process.isOutputConnected(output)) {
        return false;
    }

    return true;
}

function refreshInputValues(state: WorkspaceState) {
    return objectToObject(state.inputValues, ({ value }, name) => ({ value, canRemove: canRemoveInput(state.workspace.entryProcess, name) }))
}

function refreshOutputValues(state: WorkspaceState) {
    return objectToObject(state.outputValues, ({ value }, name) => ({ value, canRemove: canRemoveOutput(state.workspace.entryProcess, name) }))
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
    const process = state.workspace.entryProcess;

    switch (action.type) {
        case 'load': {
            const newProcess = action.workspace.entryProcess;

            return {
                workspace: action.workspace,
                lastFunctionalChange: Date.now(),
                editOperation: null,
                inputValues: mapToObject(newProcess.inputs, (_type, name) => ({ value: '', canRemove: canRemoveInput(newProcess, name) })),
                outputValues: mapToObject(newProcess.outputs, (_type, name) => ({ value: '', canRemove: canRemoveInput(newProcess, name) })),
                ...propsFromProcess(newProcess),
            }
        }
        case 'setInput':
            const inputValues = refreshInputValues(state);
            inputValues[action.name] = { value: action.value, canRemove: canRemoveInput(process, action.name) };

            return {
                ...state,
                lastFunctionalChange: Date.now(),
                inputValues,
            }
        case 'addInput': {
            const newName = getUniqueName(process.inputs, 'Input');
            process.inputs.set(newName, 'text');
            
            const inputValues = refreshInputValues(state);
            inputValues[newName] = { value: '', canRemove: canRemoveInput(process, newName) };
            
            return {
                ...state,
                lastFunctionalChange: Date.now(),
                inputValues,
                inputs: inputsFromProcess(process),
            }
        }
        case 'removeInput': {
            process.inputs.delete(action.name);

            const inputValues = refreshInputValues(state);
            delete inputValues[action.name];

            return {
                ...state,
                lastFunctionalChange: Date.now(),
                inputValues,
                inputs: inputsFromProcess(process),
            }
        }
        case 'addOutput': {
            const newName = getUniqueName(process.outputs, 'Output');
            process.outputs.set(newName, 'text');
            
            const outputValues = refreshOutputValues(state);
            outputValues[newName] = { value: '', canRemove: canRemoveOutput(process, newName) };

            return {
                ...state,
                lastFunctionalChange: Date.now(),
                outputValues,
                outputs: outputsFromProcess(process),
            }
        }
        case 'removeOutput': {
            process.outputs.delete(action.name);

            const outputValues = refreshOutputValues(state);
            delete outputValues[action.name];

            return {
                ...state,
                lastFunctionalChange: Date.now(),
                outputValues,
                outputs: outputsFromProcess(process),
            }
        }
        case 'setOutputValues':
            // Any unconnected output won't get a value here. Ensure that we don't accidentally lose these from the output display,
            // cos the process will run as a result of adding a new output, and that would just remove it again.
            return {
                ...state,
                outputValues: {
                    ...objectToObject(state.outputValues, (_value, name) => ({ value: '', canRemove: canRemoveOutput(process, name) })),
                    ...objectToObject(action.values, (value, name) => ({ value, canRemove: canRemoveOutput(process, name) }))
                },
            }
        case 'setEditOperation': {
            const operation = action.id === null
                ? null
                : process.operations.get(action.id) ?? null;

            let newEditOperation = operation === null
                ? null
                : {
                    id: operation.id,
                    name: operation.name,
                    symbol: operation.symbol,
                    parameters: operation.parameters,
                    config: { ...operation.config }
                };

            let updatedProcessDisplay: Partial<WorkspaceState> = {};

            let changedPrevConfig = false;

            let inputValues = state.inputValues;

            if (state.editOperation) {
                // User has just finished editing an operation's config.
                // Apply the updated config to the actual operation being edited now.
                const operation = process.operations.get(state.editOperation.id);
                if (operation) {
                    operation.setConfig(state.editOperation.config);

                    // Recalculate everything in the process display.
                    updatedProcessDisplay = propsFromProcess(process),

                    changedPrevConfig = true;

                    // If a parameter has been changed from input to config, and it was connected to a process input,
                    // it would now be able to be removed, whereas it wouldn't previously.
                    inputValues = refreshInputValues(state);
                }
            }

            return {
                ...state,
                ...updatedProcessDisplay,
                inputValues,
                lastFunctionalChange: changedPrevConfig ? Date.now() : state.lastFunctionalChange,
                editOperation: newEditOperation,
            }
        }
        case 'setOperationConfigValue': {
            if (state.editOperation?.id !== action.operationId) {
                return state;
            }

            // We update the "currently editing" operation config, but don't apply this
            // to the real operation's config until we finish editing.
            const config = {
                ...state.editOperation.config,
            };

            if (action.value === null) {
                // Don't allow a config to change to an input if it's of a type that can't.
                const parameter = state.editOperation.parameters[action.config];
                if (!parameter || !canBeInput(parameter)) {
                    return state;
                }
                
                delete config[action.config];
            }
            else {
                config[action.config] = action.value;
            }

            return {
                ...state,
                lastFunctionalChange: Date.now(),
                editOperation: {
                    ...state.editOperation,
                    config,
                }
            };
        }
        case 'connect': {
            if (!tryConnect(process, action.fromOperation, action.fromConnector, action.toOperation, action.toConnector)) {
                return state;
            }
            
            return {
                ...state,
                lastFunctionalChange: Date.now(),

                // Recalculate everything in the process display.
                ...propsFromProcess(process),
            }
        }
        case 'disconnect': {
            const operation = process.operations.get(action.operation);
            if (!operation) {
                return state;
            }

            const inputName = operation.inputs[action.input][0]
            operation.inputConnections.delete(inputName);
            
            return {
                ...state,
                lastFunctionalChange: Date.now(),

                // Recalculate everything in the process display.
                ...propsFromProcess(process),
            }
        }
        case 'addOperation': {
            const functionToAdd = getFunction(action.functionId);
            if (!functionToAdd) {
                console.error('Function not found:', action.functionId);
                return state;
            }

            const id = process.getNextOperationId();

            const position = { x: 0, y: process.getMaxOperationPositionY() + 2 * gridSize };

            const operation = new FunctionOperation(id, position, functionToAdd);

            process.addOperation(operation);

            return {
                ...state,
                lastFunctionalChange: Date.now(),

                // Recalculate everything in the process display.
                ...propsFromProcess(process),
            }
        }
        case 'moveOperation': {
            const operation = process.operations.get(action.id);

            if (!operation) {
                return state;
            }

            operation.position = {
                x: action.x,
                y: action.y,
            };
            
            return {
                ...state,

                // Recalculate everything in the process display.
                ...propsFromProcess(process),
            }
        }
    }
}
