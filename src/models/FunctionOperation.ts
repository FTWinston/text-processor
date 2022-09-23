import { OperationId } from '../data/identifiers';
import { IFunctionOperation } from '../data/IOperation';
import { Value } from '../data/Value';
import { Connection } from './Connection';
import { Function } from './Function';
import { Operation } from './Operation';

export class FunctionOperation extends Operation {
    constructor(
        id: OperationId,
        public readonly functionToRun: Function,
        public config: Record<string, string> = {},
    ) {
        super(id);
        this.inputs = new Array(functionToRun.inputs.length);
    }

    public readonly type: 'function' = 'function';

    public inputs: Connection[];

    public get outputs() { return this.functionToRun.outputs; }
    
    public toJson(): IFunctionOperation {
        return {
            type: this.type,
            id: this.id,
            function: this.functionToRun.id,
            config: this.config,
            inputs: this.inputs.map(input => input.toJson()),
        };
    }
    
    public static fromJson(data: IFunctionOperation) {
        const functionToPerform = Function.allFunctions.get(data.function);

        if (!functionToPerform) {
            throw new Error(`Unrecognised function: ${data.function}`);
        }

        return new FunctionOperation(data.id, functionToPerform, data.config);
    }

    public perform(inputs: readonly Value[]) {
        return this.functionToRun.run(inputs, this.config);
    }
}