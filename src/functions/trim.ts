import { ParameterValuesFromTypes, IOValuesFromTypes} from '../data/Values';
import { CodeFunction } from '../models/CodeFunction';
import { escapeRegExp } from '../services/escapeRegExp';

type Parameters = {
    in: 'text',
    characters: 'text',
    location: 'choice',
}

type Outputs = {
    result: 'text',
}

export default new CodeFunction<Parameters, Outputs>({
    id: 'trim',
    symbol: 'TRM',
    parameters: {
        in: {
            type: 'text',
        },
        characters: {
            type: 'text',
            validation: /.+/
        },
        location: {
            type: 'choice',
            options: ['start and end', 'start only', 'end only'],
        },
    },
    outputs: {
        result: 'text',
    },
    defaultConfig: {
        characters: ' \t\n',
    },
    run: (parameters: Readonly<ParameterValuesFromTypes<Parameters>>): IOValuesFromTypes<Outputs> => {
        if (parameters.characters.length === 0) {
            return { result: parameters.in };
        }
        
        let result = parameters.in;

        let characters = `[${escapeRegExp(parameters.characters)}]`;
        
        if (parameters.location != 'end only') {
            // Trim start
            result = result.replace(new RegExp('^' + characters), '');
        }

        if (parameters.location != 'start only') {
            // Trim end
            result = result.replace(new RegExp(characters + '$'), '');
        }

        return { result };
    },
});