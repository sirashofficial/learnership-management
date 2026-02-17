/**
 * API Testing Utility
 * Simple test runner for API endpoints without external dependencies
 */

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  duration: number;
}

interface TestCase {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number;
  requiresAuth?: boolean;
  description?: string;
}

export class APITester {
  private baseUrl: string;
  private authToken: string | null = null;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async runTests(tests: TestCase[]): Promise<TestResult[]> {
    console.log(`\n🧪 Running ${tests.length} API tests...\n`);
    
    this.results = [];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.printSummary();
    return this.results;
  }

  private async runTest(test: TestCase): Promise<void> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${test.endpoint}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...test.headers,
      };

      if (test.requiresAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const options: RequestInit = {
        method: test.method,
        headers,
      };

      if (test.body && (test.method === 'POST' || test.method === 'PUT')) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      const result: TestResult = {
        endpoint: test.endpoint,
        method: test.method,
        status: response.status === test.expectedStatus ? 'PASS' : 'FAIL',
        statusCode: response.status,
        duration,
      };

      if (result.status === 'FAIL') {
        result.error = `Expected ${test.expectedStatus}, got ${response.status}`;
        
        // Try to get error message from response
        try {
          const errorData = await response.json();
          if (errorData.error) {
            result.error += ` - ${errorData.error}`;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      this.results.push(result);
      this.printTestResult(test.name, result);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        endpoint: test.endpoint,
        method: test.method,
        status: 'FAIL',
        error: error.message,
        duration,
      };

      this.results.push(result);
      this.printTestResult(test.name, result);
    }
  }

  private printTestResult(name: string, result: TestResult): void {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const status = `${result.statusCode || 'ERR'}`;
    console.log(`${icon} ${name}`);
    console.log(`   ${result.method} ${result.endpoint} - ${status} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const avgDuration = Math.round(
      this.results.reduce((sum, r) => sum + r.duration, 0) / total
    );

    console.log('\n📊 Test Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests:  ${total}`);
    console.log(`Passed:       ${passed} ✅`);
    console.log(`Failed:       ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Avg Duration: ${avgDuration}ms`);
    console.log('═'.repeat(50) + '\n');
  }
}

export default APITester;
