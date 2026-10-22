import { RoleScore, getStrategyRecommendation } from "../lib/scoring";

export const RoleScoringCard: React.FC<{ roleScore: RoleScore }> = ({ roleScore }) => {
  const strategy = getStrategyRecommendation(roleScore);

  return (
    <div className="p-5 border rounded-xl shadow-sm bg-white space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{roleScore.roleTitle}</h3>
        <span className="text-2xl font-extrabold text-blue-600">
          {roleScore.score}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Текущая готовность</p>
          <p className="font-semibold">{roleScore.readinessScore}%</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-gray-500">Будущий потенциал</p>
          <p className="font-semibold">{roleScore.futurePotentialScore}%</p>
        </div>
      </div>

      <div className="border-l-4 border-blue-500 pl-3 py-1 bg-blue-50/50">
        <p className="text-xs font-bold text-blue-700 uppercase">{strategy.type}</p>
        <p className="font-medium text-sm">{strategy.title}</p>
        <p className="text-xs text-gray-600">{strategy.description}</p>
      </div>

      {roleScore.missingSkills.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Пробелы в навыках:</p>
          <div className="flex flex-wrap gap-1">
            {roleScore.missingSkills.map((skill) => (
              <span key={skill} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-1">Рекомендованные проверенные курсы:</p>
        <ul className="text-xs space-y-1">
          {roleScore.recommendedCourses.map((course) => (
            <li key={course.title}>
              <a href={course.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {course.title} ({course.platform})
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};