const pyq_regex =
	"^(?<subject_code>[a-zA-Z0-9]+)_(?:(?<specialization_code>[a-zA-Z0-9]+)_)?(?<type>(?:midsem)|(?:endsem))_(?:(?<back>back)_)?(?<year>20[0-9]{2})(?:_(?<month>(?:jan)|(?:feb)|(?:mar)|(?:apr)|(?:may)|(?:jun)|(?:jul)|(?:aug)|(?:sep)|(?:oct)|(?:nov)|(?:dec)))?(?:_(?<date>[0-9]{1,2}))?(?:_set(?<set>[a-zA-Z0-9]+))?$";

export const pyq_pattern = new RegExp(pyq_regex);
