export function createTest() {
  let passed = 0;
  let total = 0;

  function assert(message: string, condition: boolean) {
    total++;
    if (condition) {
      passed++;
    } else {
      console.error(`FAIL: ${message || "Assertion failed"}`);
    }
  }

  function report() {
    console.log(`${passed}/${total} tests passed`);
  }

  return {
    assert,
    report,
  };
}
