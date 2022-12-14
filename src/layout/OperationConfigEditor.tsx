import Box from '@mui/material/Box';
import { SxProps } from '@mui/material/styles';
import { OperationId } from '../data/identifiers';
import { ParameterDefinition, ParameterValues } from '../data/Values';
import { ConfigParameterEdit } from './ConfigParameterEdit';

export interface OperationConfigData {
    id: OperationId;
    name: string;
    symbol: string;
    config: ParameterValues;
    parameters: Record<string, ParameterDefinition>;
}

interface OperationConfigProps extends OperationConfigData {
    setConfigValue: (id: string, value: string | null) => void;
}

const rootStyle: SxProps = {
    margin: 1,
};

const listStyle: SxProps = {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
};

export const OperationConfigEditor: React.FC<OperationConfigProps> = props => {
    const configValues = Object.entries(props.parameters).map(([id, definition]) => (
        <ConfigParameterEdit
            key={id}
            id={id}
            definition={definition}
            fixedValue={Object.hasOwn(props.config, id) ? props.config[id] as string : null}
            setFixedValue={value => props.setConfigValue(id, value)}
        />
    ));

    return (
        <Box sx={rootStyle}>
            <p>Edit config for <strong>{props.name}</strong> operation #{props.id} here!</p>

            <p>Each parameter can be a dynamic <em>input</em>, or a fixed <em>config</em> value.</p>
            
            <Box sx={listStyle}>
                {configValues}
            </Box>
        </Box>
    );
}