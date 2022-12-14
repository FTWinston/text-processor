import { IProcessConnection } from '../data/IConnection';
import { IOValue, IOType } from '../data/Values';
import { Vector2D } from '../data/Vector2D';
import { gridSize } from '../display/Constants';
import { Process } from './Process';

export class ProcessConnection {
    constructor(
        public input: string,
        private readonly process: Process,
    ) {
        // TODO: inputs are a map, outputs are an array!? Make this more efficient.
        this.inputNumber = [...process.inputs.keys()].findIndex(key => key === input);
    }
    
    private inputNumber: number;
    
    public get startPosition(): Vector2D {
        return {
            x: this.inputNumber * gridSize,
            y: -gridSize,
        }
    }

    public toJson(): IProcessConnection {
        return {
            type: this.type,
            input: this.input,
        };
    }

    public type: 'process' = 'process';

    public get valueType(): IOType {
        const inputType = this.process.inputs.get(this.input)

        if (!inputType) {
            throw new Error(`Trying to access unrecognised input "${this.input}" of process ${this.process.id}`);
        }

        return inputType;
    }

    public getValue(): IOValue {
        const inputs = this.process.currentInputs;

        if (inputs === null) {
            throw new Error(`Trying to access input #${this.input} of process ${this.process.id}, but its hasn't yet resolved`);
        }

        return inputs[this.input];
    }
}
