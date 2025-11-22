
// Capacity Warning Modal Component
const CapacityWarningModal = ({ warnings, onConfirm, onCancel, onChooseAnother }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">
            Capacity Warnings
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            The following members are at or over capacity:
          </p>
          <ul className="space-y-3">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm">
                <div className={`p-3 rounded-lg ${
                  warning.isOverCapacity ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      warning.isOverCapacity ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {warning.memberName}
                    </span>
                    <span className={`text-xs ${
                      warning.isOverCapacity ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {warning.currentTasks}/{warning.capacity} tasks
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${
                    warning.isOverCapacity ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {warning.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={onConfirm}
            className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition duration-200 font-medium"
          >
            Assign Anyway
          </button>
          <button
            onClick={onChooseAnother}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
          >
            Auto-assign Instead
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
          >
            Choose Different Members
          </button>
        </div>
      </div>
    </div>
  );
};
export default CapacityWarningModal