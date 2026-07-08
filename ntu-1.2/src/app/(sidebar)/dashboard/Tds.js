const TDS = ({ width, height, value }) => {
  let textColor = '';

  if (value < 500) {
    textColor = 'text-green-500'; //Hijau
  } else if (value >= 500 && value < 800) {
    textColor = 'text-yellow-300'; // Kuning
  } else if (value >= 800 && value < 1500) {
    textColor = 'text-orange-400'; // Orange
  } else if (value > 1500) {
    textColor = 'text-red-600'; // Merah
  } else {
    textColor = 'text-white'; // default
  }

  return (
    <div
      className="bg-[#0B1739] border-[1px] border-[#343B4F] rounded-sm flex flex-col justify-between px-5 py-6"
      style={{ width: width, height: height }}
    >
      <h1 className="text-white text-2xl">TDS</h1>
      <div className="flex flex-row items-end justify-end">
        <h1 className={`${textColor} text-5xl pr-4`}>{value}</h1>
        <div className="flex flex-col items-end">
          <h1 className="text-white text-2xl">ppm</h1>
        </div>
      </div>
    </div>
  );
};

export default TDS;
