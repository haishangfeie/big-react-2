const supportSymbol =
  typeof Symbol === 'function' && typeof Symbol.for === 'function';

export const REACT_ELEMENT_TYPE = supportSymbol
  ? Symbol.for('react.element')
  : 0xeac;
