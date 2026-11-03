// Run the same journey contract with browser-generated touch input throughout.
process.env.TOUCH='1';
require('./published-alpha-flow.test.cjs');
