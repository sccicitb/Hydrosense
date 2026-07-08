const WaterLevel = ({ width, height, value, location }) => {
  let valueColor = "#1DC286"; // Default hijau
  if (value <= 100) {
    valueColor = "#FF4C4C"; // Merah
  } else if (value <= 200) {
    valueColor = "#FFC107"; // Kuning
  }

  return (
    <div
      className="bg-[#0B1739] border-[1px] border-[#343B4F] rounded-sm flex flex-row items-center justify-between px-5 py-6"
      style={{ width: width, height: height }}
    >
      <h1 className="text-blue-600 font-bold text-3xl">{location}</h1>
      <div className="flex flex-col justify-between items-center gap-4">
        <h1 className="text-white text-base">Water Available</h1>
        <h1 className="text-white text-2xl">
          <span className="text-3xl" style={{ color: valueColor }}>{value}</span> Cm
        </h1>
      </div>
    </div>
  );
};

export default WaterLevel;
