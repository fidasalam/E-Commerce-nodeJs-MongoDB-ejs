import React, { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: inputValue,status: false }]);
      setInputValue('');
    }
  };
  const toggleStatus = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, status: !todo.status } : todo
    ));}
    
  const deleteTodo = id => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="container">
      <h1>To Do List</h1>
      <div className="inputField">
        <input
          type="text"
          placeholder="Add item..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
        />
        <button onClick={addTodo}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
      
      <div className="toDoList">
        <span>Tasks</span>
        <div className="list-items">
          {todos.map(todo => (
            <div className="items" key={todo.id}>
                <div className="items-text">
                <input
                  type="checkbox"
                  checked={todo.status}
                  onChange={() => toggleStatus(todo.id)}
                />
                <div className={todo.status ? 'isChecked' : ''}>{todo.text}</div>
              </div>
              <div className="delete-icon" onClick={() => deleteTodo(todo.id)}>
                <i className="fas fa-times"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="stats">Total Tasks: {todos.length}</div>
    </div>
  );
}

export default App;
