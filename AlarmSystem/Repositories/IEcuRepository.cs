using AlarmSystemHMI.Models;

namespace AlarmSystemHMI.Repositories
{
    public interface IEcuRepository
    {
        Task<List<Ecu>> GetAllAsync();
        Task<Ecu?> GetByIdAsync(int id);
    }
}
