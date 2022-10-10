import { Process } from '../models/Process';
import { ConnectionProps } from './ConnectionDisplay';
import { OperationProps } from './OperationDisplay';
import { ProcessDisplay } from './ProcessDisplay';

interface Props {
    process: Process;
}

export const ProcessAdaptor: React.FC<Props> = ({ process }) => {
    const operations: OperationProps[] = [];
    const connections: ConnectionProps[] = [];

    for (const operation of process.operations.values()) {
        operations.push({
            id: operation.id,
            type: operation.type,
            symbol: operation.symbol,
            name: operation.name,
            width: Math.max(operation.inputs.length, operation.outputs.length, 2),
            height: 1,
            position: operation.position,
            inputs: operation.inputs.map(input => ({ type: input[1], connected: operation.inputConnections.has(input[0]) })),
            outputs: operation.outputs.map(output => ({ type: output[1], connected: operation.outputConnections.has(output[0]) })),
        });
        
        for (const [name, connection] of operation.inputConnections) {
            connections.push({
                id: `${operation.id}_${name}`,
                type: connection.valueType,
                from: connection.startPosition,
                to: operation.getInputPosition(name),
            })
        }
    }

    for (const [name, connection] of process.outputConnections.entries()) {
        connections.push({
            id: `${process.id}_${name}`,
            type: connection.valueType,
            from: connection.startPosition,
            to: process.getOutputPosition(name),
        })
    }

    return (
        <ProcessDisplay
            operations={operations}
            connections={connections}
        />
    );
}