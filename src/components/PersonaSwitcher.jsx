// Exact component as provided by user — no modifications
export function PersonaSwitcher({ activeRole, setRole }) {
  const roles = [
    { id: 'farmer',    label: 'Farmer',        icon: '🧑‍🌾' },
    { id: 'buyer',     label: 'Buyer',          icon: '🏢' },
    { id: 'logistics', label: 'Fleet & Admin',  icon: '🚚' },
  ];

  return (
    <div className="flex bg-gray-100 p-1 rounded-full border border-gray-200">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => setRole(role.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeRole === role.id
              ? 'bg-[#0D7A51] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="mr-1.5">{role.icon}</span>
          {role.label}
        </button>
      ))}
    </div>
  );
}
