/**
 * Lightweight & Safe Markdown to HTML Parser
 * Converts Markdown formatting to clean HTML without external dependencies.
 */
const MarkdownParser = {
  // Sanitize raw text to prevent XSS attacks
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  parse(markdownText) {
    if (!markdownText) return '';

    let text = markdownText;

    // 1. Extract and preserve code blocks
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang, code: this.escapeHtml(code.trim()) });
      return id;
    });

    // 2. Extract and preserve inline code
    const inlineCodes = [];
    text = text.replace(/`([^`]+)`/g, (match, code) => {
      const id = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(this.escapeHtml(code));
      return id;
    });

    // 3. Escape HTML in the rest of the text
    text = this.escapeHtml(text);

    // 4. Headings (H1, H2, H3, H4)
    text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 5. Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 6. Bold and Italic
    text = text.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    text = text.replace(/___(.*?)___/gim, '<strong><em>$1</em></strong>');
    text = text.replace(/__(.*?)__/gim, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/gim, '<em>$1</em>');

    // 7. Images ![alt](url)
    text = text.replace(/!\[(.*?)\]\((.*?)\)/gim, '<figure class="content-img-wrap"><img src="$2" alt="$1" class="content-img" loading="lazy" /><figcaption>$1</figcaption></figure>');

    // 8. Links [text](url)
    text = text.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 9. Unordered Lists
    text = text.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li>$1</li>');
    text = text.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
    text = text.replace(/<\/ul>\s*<ul>/gim, '');

    // 10. Paragraphs & Line Breaks
    const paragraphs = text.split(/\n{2,}/);
    text = paragraphs
      .map(p => {
        p = p.trim();
        if (!p) return '';
        // If it starts with a block tag, do not wrap in <p>
        if (/^<(h1|h2|h3|h4|ul|ol|blockquote|figure)/i.test(p)) {
          return p;
        }
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');

    // 11. Restore Code Blocks
    codeBlocks.forEach((item, index) => {
      const replacement = `<pre><code class="language-${item.lang || 'plaintext'}">${item.code}</code></pre>`;
      text = text.replace(`__CODE_BLOCK_${index}__`, replacement);
    });

    // 12. Restore Inline Code
    inlineCodes.forEach((code, index) => {
      text = text.replace(`__INLINE_CODE_${index}__`, `<code>${code}</code>`);
    });

    return text;
  }
};
