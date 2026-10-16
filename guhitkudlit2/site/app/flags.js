export const PARAMS = new URL(location).searchParams;
export const DEBUG = PARAMS.has("debug");
