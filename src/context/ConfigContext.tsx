import React, {createContext, Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState} from 'react';
import { useLocalStorage } from 'react-use';
import { useDebounce } from 'use-debounce';

type Props = {
    initialInput: string,
    children: React.ReactNode[] | React.ReactNode,
};

type Results = { [key: string]: any|Results };

type ContextProps = {
    configInput: string | undefined,
    setConfigInput: Dispatch<SetStateAction<string | undefined>>,
    processInput: (textInput: string | undefined, options?: ProcessOptions) => void,
    error: string | null,
    results: Results | null,
    language: string,
    isProcessing: boolean,
    debug: boolean,
    setDebug: Dispatch<SetStateAction<boolean>>,
    autoGen: boolean,
    setAutoGen: Dispatch<SetStateAction<boolean>>,
    autoGen3D: boolean,
    setAutoGen3D: Dispatch<SetStateAction<boolean>>
};

type ProcessOptions = {
    pointsOnly: boolean
    debug?: boolean
};

export interface WorkerResponseMsg {
    results: Results | null
    language: string | null
    error: string | null
}

export interface WorkerInputMsg {
    textInput: string | undefined
    options: ProcessOptions
}

export const ConfigContext = createContext<ContextProps | null>(null);
export const CONFIG_LOCAL_STORAGE_KEY = 'LOCAL_STORAGE_CONFIG'

const ConfigContextProvider = ({initialInput, children}: Props) => {
    const [configInput, setConfigInput] = useLocalStorage<string>(CONFIG_LOCAL_STORAGE_KEY, initialInput);
    const [debouncedConfigInput] = useDebounce(configInput, 500);
    const [error, setError] = useState<string|null>(null);
    const [results, setResults] = useState<Results|null>(null);
    const [language, setLanguage] = useState<string>('yaml');
    const [debug, setDebug] = useState<boolean>(true);
    const [autoGen, setAutoGen] = useState<boolean>(true);
    const [autoGen3D, setAutoGen3D] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const workerRef = useRef<Worker | null>(null);


    // eslint-disable-next-line react-hooks/exhaustive-deps
    const processInput = useCallback((
        textInput: string | undefined,
        options: ProcessOptions = { pointsOnly: true, debug: false },
    ) => {
        const msg: WorkerInputMsg = { textInput, options };
        const worker = new Worker(new URL('../workers/worker.ts', import.meta.url));
        setIsProcessing(true);
        workerRef.current?.terminate();
        workerRef.current = worker;
        worker.postMessage(msg);
        worker.onmessage = ({ data: { error, results, language } }: MessageEvent<WorkerResponseMsg>) => {
            if (language) {
                setLanguage(language);
            }

            setError(error)
            setResults(results)
            setIsProcessing(false);
        };
    }, [workerRef]);

    useEffect(() => {
        if (autoGen) {
            processInput(debouncedConfigInput, { pointsOnly: !autoGen3D, debug });
        }
    }, [debouncedConfigInput, autoGen, autoGen3D]);


    return (
        <ConfigContext.Provider
            value={ {
                configInput,
                setConfigInput,
                processInput,
                error,
                results,
                language,
                isProcessing,
                debug,
                setDebug,
                autoGen,
                setAutoGen,
                autoGen3D,
                setAutoGen3D
            } }
        >
            { children }
        </ConfigContext.Provider>
    );
};

export default ConfigContextProvider;

export const useConfigContext = () => useContext(ConfigContext);