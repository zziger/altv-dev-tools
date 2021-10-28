import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import CodeEditor from './CodeEditor';

ReactDOM.render(
  <React.StrictMode>
    <div id="app">
        <CodeEditor />
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);