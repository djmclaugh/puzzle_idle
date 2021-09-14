// Helper module for vue
// TODO: Figure out how to use provided types instead.
declare const Vue: any;
export default {
  reactive: Vue.reactive,
  h: Vue.h,
  createApp: Vue.createApp,
  onMounted: Vue.onMounted,
  onBeforeUnmount: Vue.onBeforeUnmount,
}
