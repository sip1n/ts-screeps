// Extend the CreepMemory interface to include the role property
interface CreepMemory {
    role: string;
    working?: boolean; // Optional boolean to track if the creep is currently working
}

// Declare the global lodash variable for use in modules
declare const _: {
    // Use more permissive types that can accept Screeps' Memory object
    get<T, O = Record<string, unknown>>(object: O, path: string, defaultValue?: T): T;
    set<T, O = Record<string, unknown>>(object: O, path: string, value: T): O;
    has<O = Record<string, unknown>>(object: O, path: string): boolean;
    unset<O = Record<string, unknown>>(object: O, path: string): boolean;
    // Add more specific method signatures as needed
    [key: string]: unknown;
};
