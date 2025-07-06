<template>
  <div class="rich-text-display">
    <div
      class="ql-container ql-snow"
      :style="containerStyle"
    >
      <div
        class="ql-editor"
        :style="editorStyle"
        v-html="sanitizedContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'

// Props
interface Props {
  htmlContent: string
  fontSize?: string
  fontFamily?: string
}

const props = withDefaults(defineProps<Props>(), {
  fontSize: '1rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
})

// Computed properties
const sanitizedContent = computed(() => {
  // Sanitize HTML content to prevent XSS attacks
  return DOMPurify.sanitize(props.htmlContent, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style',
      'target', 'rel', 'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  })
})

const containerStyle = computed(() => ({
  border: 'none'
}))

const editorStyle = computed(() => ({
  fontSize: props.fontSize,
  fontFamily: props.fontFamily,
  padding: '12px',
  lineHeight: '1.6',
  color: '#333333'
}))
</script>

<style scoped>
.rich-text-display {
  width: 100%;
  height: 100%;
}

/* Quill Snow theme styles */
.ql-container.ql-snow {
  border: none;
  font-size: inherit;
}

.ql-editor {
  padding: 12px;
  line-height: 1.6;
  color: #333;
}

.ql-editor p {
  margin: 0 0 1em 0;
}

.ql-editor p:last-child {
  margin-bottom: 0;
}

.ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
  margin: 0 0 0.5em 0;
  font-weight: bold;
}

.ql-editor h1 { font-size: 2em; }
.ql-editor h2 { font-size: 1.5em; }
.ql-editor h3 { font-size: 1.17em; }
.ql-editor h4 { font-size: 1em; }
.ql-editor h5 { font-size: 0.83em; }
.ql-editor h6 { font-size: 0.67em; }

.ql-editor ul, .ql-editor ol {
  margin: 0 0 1em 0;
  padding-left: 1.5em;
}

.ql-editor li {
  margin: 0.25em 0;
}

.ql-editor blockquote {
  border-left: 4px solid #ccc;
  margin: 1em 0;
  padding: 0.5em 1em;
  font-style: italic;
  background-color: #f9f9f9;
}

.ql-editor a {
  color: #3b82f6;
  text-decoration: underline;
}

.ql-editor a:hover {
  color: #1d4ed8;
}

.ql-editor img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.ql-editor table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.ql-editor th, .ql-editor td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.ql-editor th {
  background-color: #f2f2f2;
  font-weight: bold;
}

/* Text formatting */
.ql-editor strong {
  font-weight: bold;
}

.ql-editor em {
  font-style: italic;
}

.ql-editor u {
  text-decoration: underline;
}

.ql-editor s {
  text-decoration: line-through;
}
</style>
