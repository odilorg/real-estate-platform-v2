import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('Minimal Wizard Test', () => {
  it('should render minimal component', () => {
    function MinimalWizard() {
      return (
        <div>
          <div>Шаг 1 из 6</div>
          <button>Далее</button>
        </div>
      );
    }

    const { container, debug } = render(<MinimalWizard />);
    console.log('HTML:', container.innerHTML);
    debug();
    
    expect(container.textContent).toContain('Шаг 1 из 6');
  });
});
