import { IconButton } from '@mui/material';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/MoreVert';
import MoveIcon from '@mui/icons-material/OpenWith';
import { useId } from 'react';
import Draggable from 'react-draggable';
import { OperationId } from '../data/identifiers';
import { IOperation } from '../data/IOperation';
import { IOType } from '../data/Values';
import { Vector2D } from '../data/Vector2D';
import { ConnectorButton, connectorButtonSize } from './ConnectorButton';
import { gridSize } from './Constants';
import { moveWithArrowKeys } from '../services/moveWithArrowKeys';

export type ConnectorProps = {
    type: IOType;
    connected: boolean;
}

export interface OperationData {
    id: OperationId;
    position: Vector2D;
    width: number;
    name: string;
    symbol: string; // TODO: remove?
    type: IOperation['type'];
    inputs: ConnectorProps[];
    outputs: ConnectorProps[];
    validConnections: boolean;
}

interface OperationProps extends OperationData {
    onClicked: () => void;
    onMove: (newX: number, newY: number) => void;
    onInputClicked: (index: number) => void;
    onOutputClicked: (index: number) => void;
}

const rootStyle: SxProps<Theme> = {
    overflow: 'visible',
    height: gridSize,
    display: 'flex',
    flexDirection: 'column',
}

const invalidRootStyle: SxProps<Theme> = {
    ...rootStyle,
    borderColor: 'red',
    backgroundColor: '#fdd',
    color: 'red',
}

const connectorsStyle: SxProps<Theme> = {
    paddingTop: 0,
    paddingBottom: 0,
    height: 8,
    '& > :not(:first-of-type)': {
        marginLeft: `${gridSize - connectorButtonSize}px`,
    },
    '& > :first-of-type': {
        marginLeft: `${(gridSize - connectorButtonSize) / 2 - 9}px`,
    }
}

const topConnectorsStyle: SxProps<Theme> = {
    ...connectorsStyle,
    '& > *': {
        position: 'relative',
        top: -5,
    }
};

const bottomConnectorsStyle: SxProps<Theme> = {
    ...connectorsStyle,
    '& > *': {
        position: 'relative',
        top: 5,
    }
};

const contentWrapperStyle: SxProps<Theme> = {
    alignSelf: 'stretch',
}

const contentStyle: SxProps<Theme> = {
    paddingTop: 0,
    paddingBottom: 0,
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}

const actionButtonStyle: SxProps<Theme> = {
    paddingTop: 0.5,
    paddingBottom: 0.5,
}

const moveButtonStyle: SxProps<Theme> = {
    ...actionButtonStyle,
    cursor: 'move',
}

const unmoving = { x: 0, y: 0 };

const dragGrid: [number, number] = [gridSize, gridSize];

export const OperationDisplay: React.FC<OperationProps> = props => {
    const titleId = useId();

    const style = {
        ...(props.validConnections ? rootStyle : invalidRootStyle),
    }

    return (
        <Draggable
            handle=".dragHandle"
            grid={dragGrid}
            position={unmoving}
            onStop={(_e, data) => props.onMove(Math.max(0, data.x + props.position.x), Math.max(gridSize, data.y + props.position.y))}
        >
            <Card
                variant="outlined"
                sx={style}
                id={`operation-${props.id}`}
                aria-labelledby={titleId}
                role="group"
            >
                <CardActions sx={topConnectorsStyle}>
                    {props.inputs.map((connector, index) => (
                        <ConnectorButton
                            key={index}
                            name={'SOME INPUT'}
                            onOperation={true}
                            connected={connector.connected}
                            dataType={connector.type}
                            onClick={() => props.onInputClicked(index)}
                        />
                    ))}
                </CardActions>
                <CardContent sx={contentStyle}>
                    <IconButton
                        aria-label="move"
                        className="dragHandle"
                        edge="start"
                        sx={moveButtonStyle}
                        onKeyDown={moveWithArrowKeys(props.onMove, props.position)}
                    >
                        <MoveIcon />
                    </IconButton>

                    <CardActionArea
                        sx={contentWrapperStyle}
                        onClick={props.onClicked}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { props.onClicked(); }}}
                    >
                        <Typography
                            id={titleId}
                            variant="h5"
                            component="div"
                        >
                            {props.name}
                        </Typography>
                    </CardActionArea>
                    <IconButton
                        aria-label="more"
                        edge="end"
                        sx={actionButtonStyle}
                        onClick={e => {  }}
                    >
                        <MenuIcon />
                    </IconButton>
                </CardContent>
                <CardActions sx={bottomConnectorsStyle}>
                    {props.outputs.map((connector, index) => (
                        <ConnectorButton
                            key={index}
                            name={'SOME OUTPUT'}
                            onOperation={true}
                            connected={connector.connected}
                            dataType={connector.type}
                            onClick={() => props.onOutputClicked(index)}
                        />
                    ))}
                </CardActions>
            </Card>
        </Draggable>
    );
}