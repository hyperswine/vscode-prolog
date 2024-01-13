// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING

var testRunner = require('vscode/lib/testrunner')
testRunner.configure({
    ui: 'tdd',
    useColors: true
})
module.exports = testRunner
