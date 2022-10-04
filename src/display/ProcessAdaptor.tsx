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
            width: operation.shape.width,
            height: operation.shape.height,
            position: operation.position,
        });
        
        for (const [name, connection] of operation.currentInputs) {
            connections.push({
                id: `${operation.id}_${name}}`,
                type: connection.valueType,
                from: {
                    facing: 'U',
                    position: connection.startPosition,
                },
                to: {
                    facing: 'D',
                    position: connection.getEndPosition(operation, name),
                },
            })
        }
    }

    return (
        <ProcessDisplay
            operations={operations}
            connections={connections}
        />
    );
}