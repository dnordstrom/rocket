/**
 *
 * @param {string} groupName
 * @param {Record<string, unknown>} options
 * @param {Record<string, unknown>} data
 * @returns {Promise<string>}
 */
export async function renderJoiningGroup(groupName, options, data) {
  /**
   * @type { {order: number, stringValue: string}[] }
   */
  const group = [];
  for (const key of Object.keys(options)) {
    const value = options[key];
    if (key.startsWith(`${groupName}__`)) {
      const order = parseInt(key.substr(groupName.length + 2), 10);
      const stringValue = typeof value === 'function' ? await value(data, options) : value;
      group.push({
        order,
        stringValue,
      });
    }
  }

  group.sort((a, b) => a.order - b.order);
  return group.map(obj => obj.stringValue).join('\n');
}
