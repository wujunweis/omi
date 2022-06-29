const isQiankun = window.__POWERED_BY_QIANKUN__;

export const qiankun = {
  // 应用加载之前
  async bootstrap(props) {
    console.info('eaas bootstrap', props);
  },
  // 应用 render 之前触发
  async mount(props) {
    console.info('eaas mount', props);
  },
  // 应用卸载之后触发
  async unmount(props) {
    console.info('eaas unmount', props);
  },
};
