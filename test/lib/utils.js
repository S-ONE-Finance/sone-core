const EMPTY_ADDRESS = `0x0000000000000000000000000000000000000000`

/**
 * 
 * @param {UniswapV2Factory} factory 
 * @param {String} token0Adress 
 * @param {String} token1Address 
 * @returns 
 */
exports.getPairAddress = async (factory, token0Adress, token1Address) => {
    let pairAddress = await factory.methods.getPair(token0Adress, token1Address).call()
    if (pairAddress == EMPTY_ADDRESS) {
        // Create a new pair
        pairAddress = await factory.methods.createPair(token0Adress, token1Address).send({ from: alice })
    }
    return pairAddress
}