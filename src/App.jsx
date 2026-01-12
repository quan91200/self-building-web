import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import './App.css';

const PORTFOLIO_MD_PATH = '/portfolio.md';

const CodeBlock = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [children]);

  const handleCopy = () => {
    const code = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inline) {
    return <code className={className}>{children}</code>;
  }

  return (
    <div className="code-block-wrapper">
      <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className={className}>
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
};

// Typing Configuration
const TYPING_CONFIG = {
  textChar: 25,      // ms per char for narrative
  codeChar: 10,      // ms per char for code blocks
  headingPause: 800, // ms pause after headings
  paraPause: 500,    // ms pause after double newlines
  blockPause: 1000,  // ms pause after closing code block
  linePause: 100,    // ms pause after single newline
};

function App() {
  const [markdown, setMarkdown] = useState('');
  const [visibleChars, setVisibleChars] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef(null);
  const previewContainerRef = useRef(null);
  const liveContainerRef = useRef(null);
  const styleTagRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Tracking for incremental rendering
  const renderedBlockIndices = useRef(new Set());
  const styleContents = useRef({});

  // Initialize Style Tag
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'dynamic-portfolio-styles';
    document.head.appendChild(style);
    styleTagRef.current = style;
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Fetch and Parse Markdown into blocks
  useEffect(() => {
    fetch(PORTFOLIO_MD_PATH)
      .then(res => res.text())
      .then(text => {
        setMarkdown(text);

        const regex = /```(css|html|javascript)[\s\S]*?```/g;
        const foundBlocks = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          const type = match[1];
          const content = match[0]
            .replace(/^```(css|html|javascript)/, '')
            .replace(/```$/, '')
            .trim();
          foundBlocks.push({
            type,
            content,
            start: match.index,
            end: match.index + match[0].length
          });
        }
        setBlocks(foundBlocks);
      });
  }, []);

  // Natural Typing Logic
  useEffect(() => {
    if (!markdown || visibleChars >= markdown.length) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const typeNextChar = () => {
      const char = markdown[visibleChars];
      const prevChar = visibleChars > 0 ? markdown[visibleChars - 1] : '';

      // Determine if we are inside a code block
      const isInsideCode = blocks.some(b => visibleChars >= b.start && visibleChars < b.end);

      let delay = isInsideCode ? TYPING_CONFIG.codeChar : TYPING_CONFIG.textChar;

      // Special Pauses
      if (char === '\n' && prevChar === '\n') {
        delay = TYPING_CONFIG.paraPause;
      } else if (char === '\n') {
        // Check if the current line was a heading
        const lastNewLine = markdown.lastIndexOf('\n', visibleChars - 1);
        const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
        const currentLine = markdown.slice(lineStart, visibleChars);

        if (currentLine.trim().startsWith('#')) {
          delay = TYPING_CONFIG.headingPause;
        } else {
          delay = TYPING_CONFIG.linePause;
        }
      } else if (char === '`' && visibleChars > 2 && markdown.slice(visibleChars - 2, visibleChars + 1) === '```') {
        // If we just finished a block
        const isEndOfBlock = blocks.some(b => visibleChars + 1 === b.end);
        if (isEndOfBlock) {
          delay = TYPING_CONFIG.blockPause;
        }
      }

      typingTimerRef.current = setTimeout(() => {
        setVisibleChars(prev => prev + 1);
      }, delay);
    };

    typeNextChar();
    return () => clearTimeout(typingTimerRef.current);
  }, [markdown, visibleChars, blocks]);

  // Auto-scroll the editor
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleChars]);

  // Block Execution & Incremental Rendering
  useEffect(() => {
    blocks.forEach((block, index) => {
      // 1. Handle blocks that are just finishing
      if (visibleChars >= block.end && !renderedBlockIndices.current.has(index)) {
        commitBlock(block, index);
        renderedBlockIndices.current.add(index);
      }
      // 2. Handle blocks in progress (Real-time injection)
      else if (visibleChars > block.start && visibleChars < block.end) {
        updateLivePreview(block, index);
      }
    });
  }, [visibleChars, blocks]);

  const updateLivePreview = (block, blockIndex) => {
    let typedInBlock = markdown.slice(block.start, Math.min(visibleChars, block.end));

    // Clean up all markdown code artifacts (```lang, ```, and partial backticks)
    const cleanTyped = typedInBlock
      .replace(/^```(css|html|javascript)?/, '')
      .replace(/```$/, '')
      .replace(/^`+/, '')
      .replace(/`+$/, '')
      .trim();

    if (block.type === 'css') {
      // Store CSS in a per-block index to maintain full ruleset integrity
      styleContents.current[blockIndex] = cleanTyped;
      if (styleTagRef.current) {
        // Re-join all blocks to ensure cascading order and completeness
        styleTagRef.current.textContent = Object.values(styleContents.current)
          .filter(Boolean)
          .join('\n');
      }
    } else if (block.type === 'html') {
      if (liveContainerRef.current) {
        // Direct DOM update for maximum responsiveness during typing
        liveContainerRef.current.innerHTML = cleanTyped;

        // Auto-scroll the preview as the live content grows
        const lastChild = liveContainerRef.current.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }
    }
  };

  const commitBlock = (block, blockIndex) => {
    if (block.type === 'html' && previewContainerRef.current) {
      const cleanContent = block.content.trim();
      const finishedBlock = document.createElement('div');
      finishedBlock.className = 'committed-block';
      finishedBlock.innerHTML = cleanContent;

      previewContainerRef.current.appendChild(finishedBlock);

      if (liveContainerRef.current) liveContainerRef.current.innerHTML = '';
      finishedBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (block.type === 'javascript') {
      try {
        const runner = new Function(block.content);
        runner();
      } catch (e) {
        console.error('JS Execution Error:', e);
      }
    }
  };

  const handleRestart = () => {
    if (styleTagRef.current) styleTagRef.current.textContent = '';
    if (previewContainerRef.current) previewContainerRef.current.innerHTML = '';
    if (liveContainerRef.current) liveContainerRef.current.innerHTML = '';

    styleContents.current = {};
    renderedBlockIndices.current = new Set();
    setVisibleChars(0);
  };

  const currentContent = markdown.slice(0, visibleChars);

  return (
    <div className={`app-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="editor-container">
        <div className="editor-pane" ref={scrollRef}>
          <div className="editor-header">
            <div className="dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="filename">portfolio.md</div>
            <div style={{ flex: 1 }}></div>
            <div className="editor-actions">
              <button className="icon-btn" onClick={handleRestart} title="Start Again">↺</button>
              <button className="icon-btn" onClick={() => setVisibleChars(markdown.length)} title="Skip Build">⏭</button>
            </div>
          </div>
          <div className="editor-content">
            <ReactMarkdown
              components={{
                code: CodeBlock
              }}
            >
              {currentContent}
            </ReactMarkdown>

            {visibleChars >= markdown.length && (
              <p className="final-message">
                The build is complete. Welcome to the future of digital portfolios.
              </p>
            )}

            {isTyping && <span className="cursor">|</span>}
          </div>
        </div>

        <button
          className="collapse-handle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Editor" : "Collapse Editor"}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <div className="preview-pane">
        {!isCollapsed && (
          <div className="preview-header">
            <div className="url-bar">localhost:3000 / portfolio</div>
          </div>
        )}
        <div className="preview-content-wrapper">
          <div id="preview-container" ref={previewContainerRef} />
          <div id="live-construction-zone" ref={liveContainerRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
