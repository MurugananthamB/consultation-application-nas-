import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronDown, FaCheck } from 'react-icons/fa';

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options...",
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  style = {},
  onFirstClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection
  const handleOptionSelect = (option) => {
    const isSelected = value.some(v => v.value === option.value);
    let newValue;
    
    if (isSelected) {
      // Remove option
      newValue = value.filter(v => v.value !== option.value);
    } else {
      // Add option
      newValue = [...value, option];
    }
    
    onChange(newValue);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[focusedIndex]);
        } else if (isOpen) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'Backspace':
        if (searchTerm === "" && value.length > 0) {
          // Remove last selected item
          const newValue = value.slice(0, -1);
          onChange(newValue);
        }
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Remove selected option
  const removeOption = (optionToRemove) => {
    const newValue = value.filter(option => option.value !== optionToRemove.value);
    onChange(newValue);
  };

  return (
    <div 
      ref={dropdownRef}
      className={`position-relative ${className}`}
      style={style}
    >
      <div
        className={`input-group ${disabled ? 'opacity-50' : ''}`}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => {
          if (!disabled) {
            // Call onFirstClick if provided and hasn't been called yet
            if (onFirstClick && !hasBeenClicked) {
              onFirstClick();
              setHasBeenClicked(true);
            }
            setIsOpen(!isOpen);
          }
        }}
      >
        {Icon && (
          <span className="input-group-text bg-white border-end-0">
            <Icon className="text-primary" />
          </span>
        )}
        
        <div
          className="form-control border-start-0 d-flex align-items-center flex-wrap"
          style={{ 
            height: "45px",
            minHeight: "45px",
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        >
          {/* Selected items */}
          <div className="d-flex flex-wrap gap-1 me-2">
            {value.map((selectedOption) => (
              <motion.span
                key={selectedOption.value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="badge bg-primary d-flex align-items-center"
                style={{ fontSize: '0.75rem' }}
              >
                {selectedOption.label}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-1"
                  style={{ fontSize: '0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(selectedOption);
                  }}
                  disabled={disabled}
                />
              </motion.span>
            ))}
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="border-0 flex-grow-1"
            style={{ 
              outline: 'none',
              background: 'transparent',
              fontSize: '0.875rem'
            }}
            onFocus={() => {
              // Call onFirstClick if provided and hasn't been called yet
              if (onFirstClick && !hasBeenClicked) {
                onFirstClick();
                setHasBeenClicked(true);
              }
              setIsOpen(true);
            }}
          />
        </div>

        {/* Dropdown arrow */}
        <span className="input-group-text bg-white border-start-0">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown className="text-muted" />
          </motion.div>
        </span>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg"
            style={{ 
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {loading ? (
              <div className="p-3 text-center text-muted">
                <div className="spinner-border spinner-border-sm me-2" />
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-muted">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              <div>
                {filteredOptions.map((option, index) => {
                  const isSelected = value.some(v => v.value === option.value);
                  const isFocused = index === focusedIndex;
                  
                  return (
                    <motion.div
                      key={option.value}
                      className={`px-3 py-2 d-flex align-items-center justify-content-between ${
                        isFocused ? 'bg-light' : ''
                      }`}
                      style={{
                        cursor: 'pointer',
                        borderBottom: index < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                      onClick={() => handleOptionSelect(option)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      <span className="flex-grow-1">{option.label}</span>
                      {isSelected && (
                        <FaCheck className="text-primary" size={12} />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSelect; 