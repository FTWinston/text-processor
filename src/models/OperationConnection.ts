import { IOperationConnection } from '../data/IConnection';
import { OperationId } from '../data/identifiers';
import { IOValue, IOType } from '../data/Values';
import { Vector2D } from '../data/Vector2D';
import { Connection } from './Connection';
import { Operation } from './Operation';

export class OperationConnection extends Connection {
    constructor(
        public from: Operation,
        public output: string,
    ) {
        super();

        this.outputNumber = from.outputs.findIndex(connection => connection[0] === output);
    }
    
    private outputNumber: number;

    public get startPosition(): Vector2D {
        return {
            x: this.from.position.x + this.outputNumber,
            y: this.from.position.y,
        }
    }

    public toJson(): IOperationConnection {
        return {
            type: this.type,
            from: this.from.id,
            output: this.output,
        };
    }

    public static fromJson(data: IOperationConnection, operations: ReadonlyMap<OperationId, Operation>): OperationConnection {
        const from = operations.get(data.from);

        if (!from) {
            throw new Error(`Unrecognised operation ID: ${data.from}`);
        }

        if (!Object.hasOwn(from.outputs, data.output)) {
            throw new Error(`Operation output "${data.output}" not recognised for operation ${from.id}`);
        }

        return new OperationConnection(from, data.output);
    }

    public type: 'operation' = 'operation';

    public get valueType(): IOType {
        return this.from.outputs[this.outputNumber][1];
    }

    public getValue(): IOValue {
        const outputs = this.from.currentOutputs;

        if (outputs === null) {
            throw new Error(`Trying to access output #${this.output} of operation ${this.from.id}, but it hasn't yet resolved`);
        }

        return outputs[this.output];
    }
}
