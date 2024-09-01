import yaml from 'js-yaml'

import type { WorkerInputMsg, WorkerResponseMsg } from '../context/ConfigContext'
import ergogen from './ergogen.js'

type Results = { [key: string]: any | Results }

const parseConfig = (inputString: string): [string | null, { [key: string]: any[] }] => {
    let type = null
    let parsedConfig = null

    try {
        parsedConfig = JSON.parse(inputString)
        type = 'json'
        return [type, parsedConfig]
    } catch (e: unknown) {
        // Input is not valid JSON
    }

    try {
        parsedConfig = yaml.load(inputString)
        type = 'yaml'
    } catch (e: unknown) {
        // Input is not valid YAML
    }

    return [type, parsedConfig]
}

/* eslint-disable-next-line no-restricted-globals */
self.onmessage = async ({ data: { textInput, options } }: MessageEvent<WorkerInputMsg>) => {
    let results: Results | null = null
    let inputConfig: string | {} = textInput ?? ''
    const [language, parsedConfig] = parseConfig(textInput ?? '')

    // When running this as part of onChange we only send 'points', 'units' and 'variables' to generate a preview
    // If there is no 'points' key we send the input to Ergogen as-is, it could be KLE or invalid.
    if (parsedConfig?.points && options?.pointsOnly) {
        inputConfig = {
          points: {...parsedConfig?.points},
          units: {...parsedConfig?.units},
          variables: {...parsedConfig?.variables},
          outlines: {...parsedConfig?.outlines}
        }
    }

    try {
        results = await ergogen.process(
          inputConfig,
          options.debug, // debug
          (m: string) => console.log(m) // logger
        );
    } catch (e: unknown) {
        if(!e) return;

        if (typeof e === "string") {
          const msg: WorkerResponseMsg = { results: null, language, error: e }
          postMessage(msg);
        }
        if (typeof e === "object") {
          const msg: WorkerResponseMsg = { results: null, language, error: e.toString() }
          postMessage(msg);
        }
        return;
    }

    const msg: WorkerResponseMsg = { results, language, error: null }
    postMessage(msg);
}
