import React from 'react'

const ProgressBar = () => {
      const [progress, setProgress] = React.useState(0);

      React.useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/courses/test");
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setProgress(data.progress);
          console.log(data)
        };
        // ws.onclose = () => setProgress(0);
        return () => ws.close();
      }, []);

      return (
        <div className="w-full max-w-md mx-auto mt-10">
          <div className="bg-gray-200 rounded-full h-6">
            <div
              className="bg-blue-600 h-6 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            >
              <span className="text-white text-center block">{progress}%</span>
            </div>
          </div>
        </div>
      );
    };

export default ProgressBar
