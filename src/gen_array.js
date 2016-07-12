/**
 * Generate an array of `x` repeated `arraySize` times
 */
export default (arraySize, x) => {
    const out = [];
    for (let i = 0; i < arraySize; ++i) {
        out.push(x);
    }
    return out;
};