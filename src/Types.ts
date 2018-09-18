export type EventListenerCallback<T> = (e: EventFullProps<T>) => unknown;

export type EventPublicProps = {
    [key: string]: unknown
}

export type EventFullProps<T> = EventPublicProps & {
    target: T;
    stopPropagation: () => void;
    preventDefault: () => void;
}
