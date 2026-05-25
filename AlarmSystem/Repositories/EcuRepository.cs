using AlarmSystemHMI.Data;
using AlarmSystemHMI.Models;
using Microsoft.EntityFrameworkCore;

namespace AlarmSystemHMI.Repositories
{
    public class EcuRepository : IEcuRepository
    {
        private readonly AlarmDbContext _context;

        public EcuRepository(AlarmDbContext context)
        {
            _context = context;
        }

        public Task<List<Ecu>> GetAllAsync()
        {
            return _context.Ecus.OrderBy(e => e.Id).ToListAsync();
        }

        public Task<Ecu?> GetByIdAsync(int id)
        {
            return _context.Ecus.FirstOrDefaultAsync(e => e.Id == id);
        }
    }
}
