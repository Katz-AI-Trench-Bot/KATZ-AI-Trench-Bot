export function createKeyboard(buttons, options = {}) {
  return {
    inline_keyboard: buttons.map(row => 
      row.map(button => 
        typeof button === 'string' 
          ? { text: button, callback_data: button }
          : button
      )
    ),
    ...options
  };
}