import { OperationId, ProcessId } from '../data/identifiers';
import { IProcess } from '../data/IProcess';
import { IOValues, IOType } from '../data/Values';
import { Operation } from './Operation';
import { determineOperationExecutionOrder } from '../services/determineOperationExecutionOrder';
import { OperationConnection } from './OperationConnection';
import { mapToArray, mapToObject } from '../services/maps';

export class Process {
    constructor(
        public readonly id: ProcessId,
        private readonly _operations: Map<OperationId, Operation>,
        public inputs: ReadonlyMap<string, IOType>,
        public outputs: ReadonlyMap<string, IOType>,
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

    public get operations(): ReadonlyMap<OperationId, Operation> { return this._operations; }

    public addOperation(operation: Operation) {
        this.sortedOperations = null;
        this._operations.set(operation.id, operation);
    }

    private sortedOperations: Operation[] | null = null;

    private _currentInputs: Readonly<IOValues> | null = null;

    public get currentInputs(): Readonly<IOValues> | null { return this._currentInputs }
    
    public run(inputs: Readonly<IOValues>): IOValues {
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