import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function isFresh(publishedAt) {
    const now = dayjs();
    const diffHours = now.diff(dayjs(publishedAt), "hour");
    return diffHours <= 24;
}

export default { isFresh };
