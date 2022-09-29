import { OperationId, ProcessId } from '../data/identifiers';
import { IProcess } from '../data/IProcess';
import { Values, ValueType } from '../data/Value';
import { Operation, operationFromJson } from './Operation';
import { connectionFromJson } from './Connection';
import { determineOperationExecutionOrder } from '../services/determineOperationExecutionOrder';
import { OperationConnection } from './OperationConnection';
import { arrayToMap, mapToArray, mapToObject, objectToMap } from '../services/maps';

export class Process {
    constructor(
        public readonly id: ProcessId,
        private readonly _operations: Map<OperationId, Operation>,
        public inputs: ReadonlyMap<string, ValueType>,
        public outputs: ReadonlyMap<string, ValueType>,
        public outputConnections: Map<string, OperationConnection>
    ) {}

    public toJson(): IProcess {
        return {
            id: this.id,
            inputs: mapToObject(this.inputs),
            outputs: mapToObject(this.outputs),
            outputConnections: mapToObject(this.outputConnections, output => output.toJson()),
            operations: mapToArray(this.operations, operation => operation.toJson()),
        };
    }
   
    public static fromJson(data: IProcess, otherProcesses: ReadonlyMap<ProcessId, Process>) {
        const operations = data.operations
                .map(operation => operationFromJson(operation, otherProcesses));
        
        const operationMap = arrayToMap<OperationId, Operation>(operations);
        const inputs = objectToMap(data.inputs);
        const outputs = objectToMap(data.outputs);
        const outputConnections = objectToMap(data.outputConnections, output => OperationConnection.fromJson(output, operationMap));

        const process = new Process(data.id, operationMap, inputs, outputs, outputConnections);

        // We can only populate input connections once we have all the operations.
        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];
            const inputData = data.operations[i].inputs;

            operation.currentInputs = objectToMap(inputData, input => connectionFromJson(input, process));
        }

        return process;
    }

    public get operations(): ReadonlyMap<OperationId, Operation> { return this._operations; }

    public addOperation(operation: Operation) {
        this.sortedOperations = null;
        this._operations.set(operation.id, operation);
    }

    private sortedOperations: Operation[] | null = null;

    private _currentInputs: Readonly<Values> | null = null;

    public get currentInputs(): Readonly<Values> | null { return this._currentInputs }
    
    public run(inputs: Readonly<Values>): Values {
        this._currentInputs = inputs;

        if (this.sortedOperations === null) {
            // Get a safe order to execute operations in, so that each only executes once its inputs have resolved their outputs.
            this.sortedOperations = determineOperationExecutionOrder(this.operations);
        }

        // Clear all operations' outputs before executing any of them, just in case.
        for (const operation of this.sortedOperations) {
            operation.clearCurrentOutputs();
        }

        for (const operation of this.sortedOperations) {
            operation.run();
        }

        this._currentInputs = null;

        return mapToObject(this.outputConnections, output => output.getValue());
    }
}