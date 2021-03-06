/* global MyContract, web3, contract, describe, it, assert */

describe('MyContract', () => {
  contract('MyContract', accounts => {
    const user = accounts[1]
    it('should add and get a relay for a given function and user', () => {
      const myContract = MyContract.deployed()
      return myContract.addCountRelay(user)
        .then(() => myContract.getRelay.call('count()', user))
    })
  })

  contract('MyContract', accounts => {
    const user = accounts[1]
    it('should invoke the host function by calling the relay contract', () => {
      const myContract = MyContract.deployed()
      return myContract.addCountRelay(user)
        .then(() => myContract.getRelay.call('count()', user))
        .then(result => {
          const relayAddress = result.valueOf()
          return myContract.counter.call()
            .then(counter => assert.equal(counter.toNumber(), 0, 'Counter did not start at 0'))
            .then(() => web3.eth.sendTransaction({ from: user, to: relayAddress }))
            .then(myContract.counter.call)
            .then(counter => assert.equal(counter.toNumber(), 1, 'Counter did not increment to 1)'))
        })
    })
  })

  contract('MyContract', accounts => {
    const user = accounts[1]
    const other = accounts[2]
    it('should not invoke the function for unauthorized users', () => {
      const myContract = MyContract.deployed()
      return myContract.addCountRelay(user)
        .then(() => myContract.getRelay.call('count()', user))
        .then(result => {
          const relayAddress = result.valueOf()
          return myContract.counter.call()
            .then(counter => assert.equal(counter.toNumber(), 0, 'Counter did not start at 0'))
            .then(() => web3.eth.sendTransaction({ from: other, to: relayAddress }))
            .then(() => { throw new Error('sendTransaction did not fail as expected') })
            .catch(err => {
              // rethrow unexepected errors
              if(!/invalid JUMP/.test(err.message)) {
                throw err;
              }
            })
        })
    })
  })

  contract('MyContract', accounts => {
    const user = accounts[1]
    const other = accounts[2]
    it('should transfer the relay to a new owner', () => {
      const myContract = MyContract.deployed()
      return myContract.addCountRelay(user)
        myContract.transferCountRelay(other)
        .then(() => myContract.getRelay.call('count()', user))
        .then(result => {
          const relayAddress = result.valueOf()
          return myContract.counter.call
            .then(counter => assert.equal(counter.toNumber(), 0, 'Counter did not start at 0'))
            .then(() => web3.eth.sendTransaction({ from: other, to: relayAddress }))
            .then(myContract.counter.call)
            .then(counter => assert.equal(counter.toNumber(), 1, 'Counter did not increment to 1)'))
        })
    })
  })

  contract('MyContract', accounts => {
    const user = accounts[1]
    it('should forward sent ether to the host contract', () => {
      const myContract = MyContract.deployed()
      return myContract.addCountRelay(user)
        .then(() => myContract.getRelay.call('count()', user))
        .then(result => {
          const relayAddress = result.valueOf()
          const balance = web3.fromWei(web3.eth.getBalance(user)).toNumber()
          web3.eth.sendTransaction({ from: user, to: relayAddress, value: web3.toWei(10) })

          // user should be -10 ETH
          assert.equal(Math.ceil(web3.fromWei(web3.eth.getBalance(user)).toNumber()), Math.ceil(balance - 10))

          // contract should be +10 ETH
          assert.equal(Math.ceil(web3.fromWei(web3.eth.getBalance(myContract.address)).toNumber()), 10)

          // relay should have 0 ETH
          assert.equal(Math.ceil(web3.fromWei(web3.eth.getBalance(relayAddress)).toNumber()), 0)
        })
    })
  })
})
