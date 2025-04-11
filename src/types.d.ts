/* eslint-disable @typescript-eslint/no-explicit-any */
// Extend the CreepMemory interface to include the role property
interface CreepMemory {
    role: string;
    working?: boolean; // Optional boolean to track if the creep is currently working
}

// Declare the global lodash variable for use in modules
declare const _: {
    // Use more permissive types that can accept Screeps' Memory object
    get<T>(object: { [key: string]: any } | any, path: string, defaultValue?: T): T;
    set<T>(object: { [key: string]: any } | any, path: string, value: T): { [key: string]: any } | any;
    has(object: { [key: string]: any } | any, path: string): boolean;
    unset(object: { [key: string]: any } | any, path: string): boolean;
    // Add more specific method signatures as needed
    [key: string]: unknown;
};
