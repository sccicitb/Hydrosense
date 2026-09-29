const Flow = ({ width, height, value, location }) => {
  // Format value ke 2 angka desimal
  const formattedValue = Number(value).toPrecision(3); // contoh: "5.98e-44"

  return (
    <div
      className="bg-[#0B1739] border-[1px] border-[#343B4F] rounded-sm px-5 py-6"
      style={{ width: width, height: height }}
    >
      <div className="flex flex-row justify-between items-center h-full">
        {/* Kiri: Title dan Info */}
        <div className="flex flex-col justify-start">
          <h1 className="text-[#F34035] text-2xl font-bold">Total Flow</h1>
          <h1 className="text-[#F34035] text-2xl font-normal">({location})</h1>
        </div>

        {/* Kanan: Value m3/s dan lps */}
        <div className="flex flex-col items-end justify-center">
          <div className="flex flex-row items-center">
            <h1 className="text-white text-2xl pr-2 font-bold">{formattedValue}</h1>
            <h6 className="text-white font-bold">L/m</h6>
          </div>
          <div className="flex flex-row items-center pt-2">
            <h1 className="text-[#AAB8C2] text-xl pr-2 font-normal">{formattedValue}</h1>
            <h6 className="text-[#AAB8C2] font-normal">lps</h6>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flow;
