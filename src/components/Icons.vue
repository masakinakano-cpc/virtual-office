<template>
  <!-- This file exports icon components -->
</template>

<script lang="ts" setup>
import { defineComponent, h } from 'vue';

// Upload Icon Component
export const UploadIcon = defineComponent({
  name: 'UploadIcon',
  props: {
    width: {
      type: [String, Number],
      default: 24,
    },
    height: {
      type: [String, Number],
      default: 24,
    },
    color: {
      type: String,
      default: 'currentColor',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 30 30',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('path', {
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        d: 'M15.893 4.113a1.25 1.25 0 0 0-.413-.263 1.175 1.175 0 0 0-.95 0c-.153.06-.293.149-.412.263l-5 5a1.255 1.255 0 1 0 1.775 1.775l2.862-2.875V20a1.25 1.25 0 0 0 2.5 0V8.013l2.863 2.875a1.256 1.256 0 0 0 1.775-1.775l-5-5Zm9.473 13.753a1.25 1.25 0 0 1 2.134.884v5a3.75 3.75 0 0 1-3.75 3.75H6.25a3.75 3.75 0 0 1-3.75-3.75v-5a1.25 1.25 0 0 1 2.5 0v5A1.25 1.25 0 0 0 6.25 25h17.5A1.25 1.25 0 0 0 25 23.75v-5c0-.331.132-.65.366-.884Z',
        fill: props.color,
      }),
    ]);
  },
});

// Dropdown Icon Component
export const DropdownIcon = defineComponent({
  name: 'DropdownIcon',
  props: {
    width: {
      type: [String, Number],
      default: 12,
    },
    height: {
      type: [String, Number],
      default: 8,
    },
    color: {
      type: String,
      default: 'currentColor',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 12 8',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('path', {
        d: 'M11 1.17a1 1 0 0 0-1.41 0L6 4.71 2.46 1.17a1 1 0 1 0-1.41 1.42l4.24 4.24a1 1 0 0 0 1.42 0L11 2.59a1 1 0 0 0 0-1.42Z',
        fill: props.color,
      }),
    ]);
  },
});

// Trash Icon Component
export const TrashIcon = defineComponent({
  name: 'TrashIcon',
  props: {
    width: {
      type: [String, Number],
      default: 32,
    },
    height: {
      type: [String, Number],
      default: 32,
    },
    fill: {
      type: String,
      default: '#FF3165',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 32 32',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('path', {
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        d: 'M26.6667 8H21.3333V6.66667C21.3333 5.60581 20.9119 4.58839 20.1618 3.83824C19.4116 3.0881 18.3942 2.66667 17.3333 2.66667H14.6667C13.6058 2.66667 12.5884 3.0881 11.8382 3.83824C11.0881 4.58839 10.6667 5.60581 10.6667 6.66667V8H5.33333C4.97971 8 4.64057 8.14048 4.39052 8.39053C4.14048 8.64058 4 8.97972 4 9.33334C4 9.68696 4.14048 10.0261 4.39052 10.2761C4.64057 10.5262 4.97971 10.6667 5.33333 10.6667H6.66667V25.3333C6.66667 26.3942 7.08809 27.4116 7.83824 28.1618C8.58839 28.9119 9.6058 29.3333 10.6667 29.3333H21.3333C22.3942 29.3333 23.4116 28.9119 24.1618 28.1618C24.9119 27.4116 25.3333 26.3942 25.3333 25.3333V10.6667H26.6667C27.0203 10.6667 27.3594 10.5262 27.6095 10.2761C27.8595 10.0261 28 9.68696 28 9.33334C28 8.97972 27.8595 8.64058 27.6095 8.39053C27.3594 8.14048 27.0203 8 26.6667 8ZM13.3333 6.66667C13.3333 6.31305 13.4738 5.97391 13.7239 5.72386C13.9739 5.47381 14.313 5.33334 14.6667 5.33334H17.3333C17.687 5.33334 18.0261 5.47381 18.2761 5.72386C18.5262 5.97391 18.6667 6.31305 18.6667 6.66667V8H13.3333V6.66667ZM22.6667 25.3333C22.6667 25.687 22.5262 26.0261 22.2761 26.2761C22.0261 26.5262 21.687 26.6667 21.3333 26.6667H10.6667C10.313 26.6667 9.97391 26.5262 9.72386 26.2761C9.47381 26.0261 9.33333 25.687 9.33333 25.3333V10.6667H22.6667V25.3333ZM12 14.6667C12 13.9303 12.597 13.3333 13.3333 13.3333C14.0697 13.3333 14.6667 13.9303 14.6667 14.6667V22.6667C14.6667 23.403 14.0697 24 13.3333 24C12.597 24 12 23.403 12 22.6667V14.6667ZM18.6667 13.3333C17.9303 13.3333 17.3334 13.9303 17.3334 14.6667V22.6667C17.3334 23.403 17.9303 24 18.6667 24C19.4031 24 20 23.403 20 22.6667V14.6667C20 13.9303 19.4031 13.3333 18.6667 13.3333Z',
        fill: props.fill,
      }),
    ]);
  },
});

// Success Icon Component
export const SuccessIcon = defineComponent({
  name: 'SuccessIcon',
  props: {
    width: {
      type: [String, Number],
      default: 48,
    },
    height: {
      type: [String, Number],
      default: 48,
    },
    color: {
      type: String,
      default: '#10B981',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 48 48',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('circle', {
        cx: '24',
        cy: '24',
        r: '22',
        fill: props.color,
        stroke: props.color,
        strokeWidth: '2',
      }),
      h('path', {
        d: 'M16 24l6 6 12-12',
        stroke: 'white',
        strokeWidth: '3',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    ]);
  },
});

// Warning Icon Component
export const WarningIcon = defineComponent({
  name: 'WarningIcon',
  props: {
    width: {
      type: [String, Number],
      default: 48,
    },
    height: {
      type: [String, Number],
      default: 48,
    },
    color: {
      type: String,
      default: '#F59E0B',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 48 48',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('path', {
        d: 'M24 4L44 40H4L24 4Z',
        fill: props.color,
        stroke: props.color,
        strokeWidth: '2',
        strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M24 18V26',
        stroke: 'white',
        strokeWidth: '3',
        strokeLinecap: 'round',
      }),
      h('circle', {
        cx: '24',
        cy: '32',
        r: '2',
        fill: 'white',
      }),
    ]);
  },
});

// Error Icon Component
export const ErrorIcon = defineComponent({
  name: 'ErrorIcon',
  props: {
    width: {
      type: [String, Number],
      default: 48,
    },
    height: {
      type: [String, Number],
      default: 48,
    },
    color: {
      type: String,
      default: '#EF4444',
    },
  },
  setup(props) {
    return () => h('svg', {
      width: props.width,
      height: props.height,
      viewBox: '0 0 48 48',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      h('circle', {
        cx: '24',
        cy: '24',
        r: '22',
        fill: props.color,
        stroke: props.color,
        strokeWidth: '2',
      }),
      h('path', {
        d: 'M16 16L32 32M32 16L16 32',
        stroke: 'white',
        strokeWidth: '3',
        strokeLinecap: 'round',
      }),
    ]);
  },
});
</script>
