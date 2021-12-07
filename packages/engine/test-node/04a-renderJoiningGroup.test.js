import chai from 'chai';
import { renderJoiningGroup } from '../src/helpers/renderJoiningGroup.js';

const { expect } = chai;

describe('renderJoiningGroup', () => {
  it('orders positive numbers', async () => {
    expect(await renderJoiningGroup('header', {
      header__50: 'header__50',
      header__10: 'header__10',
    })).to.equal([
      'header__10',
      'header__50',
    ].join('\n'));
  });

  it('does support optional following descriptions', async () => {
    expect(await renderJoiningGroup('header', {
      header__50_bottom: 'header__50',
      header__10_top: 'header__10',
    })).to.equal([
      'header__10',
      'header__50',
    ].join('\n'));
  });

  it('orders negative numbers', async () => {
    expect(await renderJoiningGroup('header', {
      header__50: 'header__50',
      ignoreMe__10: 'ignoreMe__10',
      'header__-50': 'header__-50',
    })).to.equal([
      'header__-50',
      'header__50',
    ].join('\n'));
  });

  it('has access to data', async () => {
    expect(await renderJoiningGroup('header', {
      header__50: data => `header__50 Name: ${data.name}`,
     }, { name: 'Peter' })).to.equal([
      'header__50 Name: Peter',
    ].join('\n'));
  });

  it('does support async functions', async () => {
    expect(await renderJoiningGroup('header', {
      header__50_bottom: () => new Promise(resolve => setTimeout(resolve('header__50'), 20)),
      header__10_top: 'header__10',
    })).to.equal([
      'header__10',
      'header__50',
    ].join('\n'));
  });
});
