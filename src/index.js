import TestRecorder from './test-recorder';

const includes = (a = [], v) => a.indexOf(v) !== -1;

const reduxRecord = function({
  reducer, 
  includeReducer = true, 
  stateKey,
  actionSubset,
  equality = (result, nextState) => result === nextState
}) { 
  let initState;
  let actions = [];
  let recording = false;
  let showingTest = false;
  let stringifiedReducer = '/* IMPORT YOUR REDUCER HERE */';
  if (includeReducer) {
    stringifiedReducer = `var reducer = ${reducer.toString()}`;
  }
  const equalityFunction = equality.toString();
  const startRecord = () => recording = true;
  const stopRecord = () =>  {
    recording = false;
    showingTest = true;
  }
  const getRecordingStatus = () => recording;
  const shouldShowTest = () => showingTest;
  const hideTest = () => {
    actions = [];
    showingTest = false;
    initState = undefined;
  }
  const getTest = () => {
    /* make my template string look ugly af here so the returned code has basically proper spacing
     * TODO - look into if there is a better way to do this 
    */
    return (
`var test = require('tape');
var state = ${initState};
${stringifiedReducer}
var equality = ${equalityFunction};
test('expected state returned for each action', function(assert) {
  var actions = ${JSON.stringify(actions, 4)};
  var returnExpectedState = actions.map(function (action) {
    var result = reducer(state, action.action);
    state = result;
    return equality(result, action.nextState);
  });
  assert.ok(returnExpectedState.every(function(expected) { return expected }), 'expected state returned for each action');
  assert.end();
});`
    );
  }
  const middleware = ({getState}) => (next) => (action) => {
    if (initState === undefined) {
      initState = stateKey ? getState()[stateKey] : getState();
    }
    next(action);
    if (recording) {
      const nextState = stateKey ? getState()[stateKey] : getState();
      if (!actionSubset || includes(actionSubset, action.type)) {
        actions.push({action, nextState});
      }
    }
  };
  const props = { getRecordingStatus, startRecord, stopRecord, getTest, shouldShowTest, hideTest };
  return { middleware, props };
};
export { TestRecorder as TestRecorder };
export default reduxRecord;
