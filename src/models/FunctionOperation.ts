import { OperationId } from '../data/identifiers';
import { IFunctionOperation } from '../data/IOperation';
import { IOValues, IOType, ParameterDefinition } from '../data/Values';
import { getFunction, IFunction } from './CodeFunction';
import { Operation } from './Operation';
import { mapToObject, objectToArray } from '../services/maps';
import { Vector2D } from '../data/Vector2D';

export class FunctionOperation extends Operation {
    constructor(
        id: OperationId,
        position: Vector2D,
        public readonly functionToRun: IFunction,
        public parameters: Record<string, string> = {},
    ) {
        super(id, position);

        this.inputs = objectToArray(functionToRun.parameters, filterDefaultInput);
        this.outputs = objectToArray(functionToRun.outputs, (value, key) => [key, value]);
    }

    public readonly type: 'function' = 'function';

    public get name() { return this.functionToRun.id; }

    public get symbol() { return this.functionToRun.symbol; }

    public get numConnections() {
        return Object.keys(this.functionToRun.parameters).length + Object.keys(this.functionToRun.outputs).length;
    }

    public readonly inputs: Array<[string, IOType]>;

    public readonly outputs: Array<[string, IOType]>;
    
    public toJson(): IFunctionOperation {
        return {
            type: this.type,
            id: this.id,
            position: this.position,
            function: this.functionToRun.id,
            config: this.parameters,
            inputs: mapToObject(this.inputConnections, input => input.toJson()),
        };
    }
    
    public static fromJson(data: IFunctionOperation) {
        const functionToPerform = getFunction(data.function);

        if (!functionToPerform) {
            throw new Error(`Unrecognised function: ${data.function}`);
        }

        return new FunctionOperation(data.id, data.position, functionToPerform, data.config);
    }

    public perform(inputs: Readonly<IOValues>) {
        return this.functionToRun.performRun(inputs, this.parameters);
    }
}

function filterDefaultInput(definition: ParameterDefinition, id: string): [string, IOType] | undefined {
    if (definition.type === 'choice' || definition.type === 'toggle' || !definition.inputByDefault) {
        return undefined;
    }

    return [id, definition.type];
}