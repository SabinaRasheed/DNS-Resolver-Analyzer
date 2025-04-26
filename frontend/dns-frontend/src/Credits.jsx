import React, { useState, useEffect } from 'react';

export default function Credits() {
  const names = ["Sabina Rasheed", "Amal Abdul Rehman"];
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);

  useEffect(() => {
    const currentName = names[currentNameIndex];
    let typingSpeed = isDeleting ? 50 : 120;

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setText(currentName.substring(0, text.length - 1));
      } else {
        setText(currentName.substring(0, text.length + 1));
      }

      if (!isDeleting && text === currentName) {
        setTimeout(() => setIsDeleting(true), 1000); 
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setCurrentNameIndex((prev) => (prev + 1) % names.length); 
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, currentNameIndex, names]);

  return (
    <div className="text-center mt-10 text-cyan-300 text-sm font-semibold">
      Made by <span className="inline">{text}</span><span style={{ animation: 'blink 1s infinite' }}>|</span>

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
