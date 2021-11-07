import chai from 'chai';
import { renderJoiningGroup } from '../src/helpers/renderJoiningGroup.js';

const { expect } = chai;

describe('renderJoiningGroup', () => {
  it('orders positive numbers', async () => {
    expect(renderJoiningGroup('header', {
      header__50: 'header__50',
      header__10: 'header__10',
    })).to.equal([
      'header__10',
      'header__50',
    ].join('\n'));
  });

  it('orders negative numbers', async () => {
    expect(renderJoiningGroup('header', {
      header__50: 'header__50',
      ignoreMe__10: 'ignoreMe__10',
      'header__-50': 'header__-50',
    })).to.equal([
      'header__-50',
      'header__50',
    ].join('\n'));
  });

  it('has access to data', async () => {
    expect(renderJoiningGroup('header', {
      header__50: data => `header__50 Name: ${data.name}`,
     }, { name: 'Peter' })).to.equal([
      'header__50 Name: Peter',
    ].join('\n'));
  });
});
