import React from 'react'

const showAlert = () => {
    const showAlert = (type, message) => {
        // Simple alert implementation; can be replaced with a better UI
        alert(`${type.toUpperCase()}: ${message}`);
    };
  return (
    <div>Show Alerts</div>
  )
}

export default showAlert